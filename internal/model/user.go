package model

import "time"

// User represents a user in the system
type User struct {
	UserID           string    `db:"user_id" json:"user_id"`
	Name             string    `db:"name" json:"name"`
	Email            string    `db:"email" json:"email"`
	AvatarURL        string    `db:"avatar_url" json:"avatar_url"`
	StripeCustomerID *string   `db:"stripe_customer_id" json:"stripe_customer_id,omitempty"`
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`
}

// UserUsage represents a user's usage within their billing period
type UserUsage struct {
	UserID             string    `db:"user_id" json:"user_id"`
	CurrentUsage       int       `db:"current_usage" json:"current_usage"`
	MaxUploads         int       `db:"max_uploads" json:"max_uploads"`
	MaxSizeMB          int       `db:"max_size_mb" json:"max_size_mb"`
	PlanID             string    `db:"plan_id" json:"plan_id"`
	BillingPeriodStart time.Time `db:"starts_at" json:"billing_period_start"`
	BillingPeriodEnd   time.Time `db:"ends_at" json:"billing_period_end"`
	PlanName           string    `db:"plan_name" json:"plan_name"`
	Status             string    `db:"status" json:"status"`
}
