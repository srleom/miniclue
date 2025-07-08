package pubsub

import (
	"context"
	"os"
	"testing"
	"time"

	"app/internal/config"

	ps "cloud.google.com/go/pubsub"
)

func TestNewPublisherInvalidProject(t *testing.T) {
	cfg := &config.Config{GCPProjectID: ""}
	if _, err := NewPublisher(context.Background(), cfg); err == nil {
		t.Fatal("expected error when project ID is empty")
	}
}

func TestPublishWithEmulator(t *testing.T) {
	emulator := os.Getenv("PUBSUB_EMULATOR_HOST")
	if emulator == "" {
		t.Skip("PUBSUB_EMULATOR_HOST is not set, skip emulator integration test")
	}

	ctx := context.Background()
	cfg := &config.Config{GCPProjectID: "test-project"}
	// Create publisher
	pub, err := NewPublisher(ctx, cfg)
	if err != nil {
		t.Fatalf("failed to create PubSubPublisher: %v", err)
	}

	// Use underlying client to create topic and subscription
	topicName := "test-topic"
	topic, err := pub.client.CreateTopic(ctx, topicName)
	if err != nil {
		t.Fatalf("failed to create topic: %v", err)
	}
	subName := "test-sub"
	sub, err := pub.client.CreateSubscription(ctx, subName, ps.SubscriptionConfig{Topic: topic})
	if err != nil {
		t.Fatalf("failed to create subscription: %v", err)
	}

	// Publish a message
	msgID, err := pub.Publish(ctx, topicName, []byte("hello-emulator"))
	if err != nil {
		t.Fatalf("Publish returned error: %v", err)
	}
	if msgID == "" {
		t.Fatal("expected non-empty message ID")
	}

	// Pull the message
	recvCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	c := make(chan []byte, 1)
	go func() {
		sub.Receive(recvCtx, func(ctx context.Context, m *ps.Message) {
			c <- m.Data
			m.Ack()
			cancel()
		})
	}()

	select {
	case data := <-c:
		if string(data) != "hello-emulator" {
			t.Fatalf("expected message data 'hello-emulator', got '%s'", string(data))
		}
	case <-time.After(5 * time.Second):
		t.Fatal("timeout waiting for message from emulator subscription")
	}
}
