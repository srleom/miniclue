package util

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

// JWT claims structure
type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

// JWKSValidator handles JWT validation using JWKS endpoint
type JWKSValidator struct {
	jwks keyfunc.Keyfunc
	mu   sync.RWMutex
}

var (
	globalValidator *JWKSValidator
	validatorOnce   sync.Once
)

// InitJWKSValidator initializes the global JWKS validator
// This should be called once during application startup
func InitJWKSValidator(jwksURL string) error {
	var initErr error
	validatorOnce.Do(func() {
		ctx := context.Background()

		// Create JWKS client with automatic refresh (keyfunc v3 handles caching internally)
		jwks, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
		if err != nil {
			initErr = fmt.Errorf("failed to create JWKS client: %w", err)
			return
		}

		globalValidator = &JWKSValidator{
			jwks: jwks,
		}
	})

	return initErr
}

// GetValidator returns the global JWKS validator instance
func GetValidator() (*JWKSValidator, error) {
	if globalValidator == nil {
		return nil, errors.New("JWKS validator not initialized. Call InitJWKSValidator first")
	}
	return globalValidator, nil
}

// ValidateJWT validates a JWT token using the JWKS
func (v *JWKSValidator) ValidateJWT(tokenString string) (*Claims, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	// Parse and validate token
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, v.jwks.Keyfunc)
	if err != nil {
		return nil, fmt.Errorf("failed to validate token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// ValidateJWT is a convenience function that uses the global validator
func ValidateJWT(tokenString string) (*Claims, error) {
	validator, err := GetValidator()
	if err != nil {
		return nil, err
	}
	return validator.ValidateJWT(tokenString)
}
