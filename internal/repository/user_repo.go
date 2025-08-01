package repository

import (
	"app/internal/model"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository interface {
	CreateUser(ctx context.Context, u *model.User) error
	GetUserByID(ctx context.Context, id string) (*model.User, error)
	UpdateStripeCustomerID(ctx context.Context, userID, customerID string) error
	// GetUserByStripeCustomerID returns the user associated with the given Stripe customer ID, or nil if none
	GetUserByStripeCustomerID(ctx context.Context, customerID string) (*model.User, error)
	// GetUserUsage returns the user's current usage within their billing period and subscription status
	GetUserUsage(ctx context.Context, userID string) (*model.UserUsage, error)
}

type userRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) UserRepository {
	return &userRepo{pool: pool}
}

func (r *userRepo) CreateUser(ctx context.Context, u *model.User) error {
	query := `INSERT INTO user_profiles (user_id, name, email, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url, updated_at = NOW() RETURNING user_id, name, email, avatar_url, created_at, updated_at;`
	err := r.pool.QueryRow(ctx, query, u.UserID, u.Name, u.Email, u.AvatarURL).Scan(&u.UserID, &u.Name, &u.Email, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return fmt.Errorf("creating user %s: %w", u.UserID, err)
	}
	return nil
}

func (r *userRepo) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	var u model.User
	query := `SELECT user_id, email, name, avatar_url, stripe_customer_id, created_at, updated_at FROM user_profiles WHERE user_id=$1`
	err := r.pool.QueryRow(ctx, query, id).Scan(&u.UserID, &u.Email, &u.Name, &u.AvatarURL, &u.StripeCustomerID, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("getting user by id %s: %w", id, err)
	}
	return &u, nil
}

func (r *userRepo) UpdateStripeCustomerID(ctx context.Context, userID, customerID string) error {
	const q = `UPDATE user_profiles SET stripe_customer_id = $2 WHERE user_id = $1`
	if _, err := r.pool.Exec(ctx, q, userID, customerID); err != nil {
		return fmt.Errorf("update stripe customer id for user %s: %w", userID, err)
	}
	return nil
}

// GetUserByStripeCustomerID returns the user whose stripe_customer_id matches the given ID.
func (r *userRepo) GetUserByStripeCustomerID(ctx context.Context, customerID string) (*model.User, error) {
	var u model.User
	const q = `SELECT user_id, email, name, avatar_url, stripe_customer_id, created_at, updated_at FROM user_profiles WHERE stripe_customer_id = $1`
	err := r.pool.QueryRow(ctx, q, customerID).Scan(
		&u.UserID,
		&u.Email,
		&u.Name,
		&u.AvatarURL,
		&u.StripeCustomerID,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get user by stripe customer id: %w", err)
	}
	return &u, nil
}

// GetUserUsage returns the user's current usage within their billing period and subscription status
func (r *userRepo) GetUserUsage(ctx context.Context, userID string) (*model.UserUsage, error) {
	const q = `
		SELECT 
			us.user_id,
			us.starts_at,
			us.ends_at,
			sp.name as plan_name,
			sp.max_uploads,
			sp.max_size_mb,
			sp.id as plan_id,
			us.status,
			COALESCE(COUNT(ue.id), 0) as current_usage
		FROM user_subscriptions us
		JOIN subscription_plans sp ON us.plan_id = sp.id
		LEFT JOIN usage_events ue ON us.user_id = ue.user_id 
			AND ue.event_type = 'lecture_upload'
			AND ue.created_at >= us.starts_at 
			AND ue.created_at < us.ends_at
		WHERE us.user_id = $1
			AND us.status IN ('active', 'cancelled', 'past_due')
			AND (us.ends_at + INTERVAL '6 hours') > NOW()
		GROUP BY us.user_id, us.starts_at, us.ends_at, sp.name, sp.max_uploads, sp.max_size_mb, sp.id, us.status
	`

	var usage model.UserUsage
	err := r.pool.QueryRow(ctx, q, userID).Scan(
		&usage.UserID,
		&usage.BillingPeriodStart,
		&usage.BillingPeriodEnd,
		&usage.PlanName,
		&usage.MaxUploads,
		&usage.MaxSizeMB,
		&usage.PlanID,
		&usage.Status,
		&usage.CurrentUsage,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("no active subscription found for user %s", userID)
		}
		return nil, fmt.Errorf("getting usage for user %s: %w", userID, err)
	}
	return &usage, nil
}
