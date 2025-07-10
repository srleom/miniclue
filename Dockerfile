# Stage 1: Build the Go binary
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build the application for the app entrypoint
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/app

# Stage 2: Create the final image with alpine
FROM alpine:latest
# Install ca-certificates for TLS support
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /server
# Set the entrypoint for the container
CMD ["/server"] 