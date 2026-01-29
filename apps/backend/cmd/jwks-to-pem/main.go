package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
)

type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWK struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
	Alg string `json:"alg"`
	Use string `json:"use"`
}

func main() {
	// Fetch JWKS from local Supabase
	resp, err := http.Get("http://127.0.0.1:54321/auth/v1/.well-known/jwks.json")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching JWKS: %v\n", err)
		os.Exit(1)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading response: %v\n", err)
		os.Exit(1)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing JWKS: %v\n", err)
		os.Exit(1)
	}

	if len(jwks.Keys) == 0 {
		fmt.Fprintf(os.Stderr, "No keys found in JWKS\n")
		os.Exit(1)
	}

	// Get the first key (should be the ES256 signing key)
	key := jwks.Keys[0]
	if key.Kty != "EC" || key.Alg != "ES256" {
		fmt.Fprintf(os.Stderr, "Expected EC/ES256 key, got %s/%s\n", key.Kty, key.Alg)
		os.Exit(1)
	}

	// Decode base64url-encoded coordinates
	xBytes, err := base64.RawURLEncoding.DecodeString(key.X)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error decoding X coordinate: %v\n", err)
		os.Exit(1)
	}

	yBytes, err := base64.RawURLEncoding.DecodeString(key.Y)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error decoding Y coordinate: %v\n", err)
		os.Exit(1)
	}

	// Create ECDSA public key
	publicKey := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}

	// Marshal to PKIX format
	derBytes, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling public key: %v\n", err)
		os.Exit(1)
	}

	// Encode as PEM
	pemBlock := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: derBytes,
	}

	pemBytes := pem.EncodeToMemory(pemBlock)
	fmt.Print(string(pemBytes))
}
