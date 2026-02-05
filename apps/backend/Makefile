.PHONY: all build run clean fmt lint deploy-pubsub

# Default target
all: build

# Build the application
build:
	go build -o bin/app ./cmd/app

# Run the application
run: build
	./bin/app

# Deploy Pub/Sub resources to staging or production.
# Usage: make deploy-pubsub env=staging
#        make deploy-pubsub env=production
deploy-pubsub:
	./scripts/setup_pubsub.sh $(env)

# Format the code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Lint
lint:
	@echo "Linting code..."
	golangci-lint run
	@echo "Linting completed"

# Clean generated files
clean: 
	rm -f bin/app
