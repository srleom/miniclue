package util

import (
	"github.com/dgrijalva/jwt-go"
)

// JWT claims structure
type Claims struct {
	Email string `json:"email"`
	jwt.StandardClaims
}

func ValidateJWT(tokenString string, secret string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}
	return claims, nil
}
