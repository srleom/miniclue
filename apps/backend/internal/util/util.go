package util

import (
	"crypto/ecdsa"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// JWT claims structure
type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

// ParseECDSAPublicKey parses a PEM-encoded ECDSA public key
func ParseECDSAPublicKey(pemKey string) (*ecdsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemKey))
	if block == nil {
		return nil, errors.New("failed to decode PEM block containing public key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	ecdsaPub, ok := pub.(*ecdsa.PublicKey)
	if !ok {
		return nil, errors.New("public key is not ECDSA")
	}

	return ecdsaPub, nil
}

// ParseRSAPublicKey parses a PEM-encoded RSA public key
func ParseRSAPublicKey(pemKey string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemKey))
	if block == nil {
		return nil, errors.New("failed to decode PEM block containing public key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("public key is not RSA")
	}

	return rsaPub, nil
}

// getAlgorithmFromToken extracts the algorithm from the JWT header without validation
func getAlgorithmFromToken(tokenString string) (string, error) {
	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return "", fmt.Errorf("failed to parse token header: %w", err)
	}

	alg, ok := token.Header["alg"].(string)
	if !ok {
		return "", errors.New("token header missing 'alg' field")
	}

	return alg, nil
}

func ValidateJWT(tokenString string, keyMaterial string) (*Claims, error) {

	// Step 1: Detect algorithm from JWT header
	alg, err := getAlgorithmFromToken(tokenString)
	if err != nil {
		return nil, fmt.Errorf("failed to detect algorithm: %w", err)
	}

	// Step 2: Build appropriate keyFunc based on algorithm
	var keyFunc jwt.Keyfunc

	switch alg {
	case "HS256", "HS384", "HS512":
		// Symmetric key - use keyMaterial as-is
		secret := []byte(keyMaterial)
		keyFunc = func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v (expected HMAC)", token.Header["alg"])
			}
			return secret, nil
		}

	case "RS256", "RS384", "RS512":
		// RSA asymmetric - parse PEM as RSA public key
		publicKey, err := ParseRSAPublicKey(keyMaterial)
		if err != nil {
			return nil, fmt.Errorf("failed to parse RSA public key: %w", err)
		}
		keyFunc = func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v (expected RSA)", token.Header["alg"])
			}
			return publicKey, nil
		}

	case "ES256", "ES384", "ES512":
		// ECDSA asymmetric - parse PEM as ECDSA public key
		publicKey, err := ParseECDSAPublicKey(keyMaterial)
		if err != nil {
			return nil, fmt.Errorf("failed to parse ECDSA public key: %w", err)
		}
		keyFunc = func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v (expected ECDSA)", token.Header["alg"])
			}
			return publicKey, nil
		}

	default:
		return nil, fmt.Errorf("unsupported signing algorithm: %s", alg)
	}

	// Step 3: Validate token with appropriate key
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, keyFunc)
	if err != nil {
		return nil, fmt.Errorf("failed to validate token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
