package handler

import (
	"encoding/json"
	"net/http"

	"app/internal/api/v1/dto"
	"app/internal/middleware"
	"app/internal/service"

	"github.com/rs/zerolog"
)

// SubscriptionHandler handles subscription-related endpoints.
type SubscriptionHandler struct {
	stripeSvc *service.StripeService
	subSvc    service.SubscriptionService
	logger    zerolog.Logger
}

// NewSubscriptionHandler creates a new SubscriptionHandler.
func NewSubscriptionHandler(stripeSvc *service.StripeService, subSvc service.SubscriptionService, logger zerolog.Logger) *SubscriptionHandler {
	return &SubscriptionHandler{stripeSvc: stripeSvc, subSvc: subSvc, logger: logger}
}

// RegisterRoutes registers the subscription endpoints.
func (h *SubscriptionHandler) RegisterRoutes(mux *http.ServeMux, authMiddleware func(http.Handler) http.Handler) {
	mux.Handle("/subscriptions/checkout", authMiddleware(http.HandlerFunc(h.Checkout)))
	mux.Handle("/subscriptions/portal", authMiddleware(http.HandlerFunc(h.Portal)))
}

// Checkout godoc
// @Summary Initiate a Stripe Checkout session for plan upgrade
// @Description Creates a Stripe Checkout session and returns its URL.
// @Tags subscriptions
// @Accept json
// @Produce json
// @Param subscription body dto.SubscriptionCheckoutRequest true "Subscription checkout request"
// @Success 200 {object} map[string]string "URL of the Stripe Checkout session"
// @Failure 400 {string} string "invalid request payload"
// @Failure 401 {string} string "unauthorized"
// @Failure 500 {string} string "failed to create checkout session"
// @Router /subscriptions/checkout [post]
func (h *SubscriptionHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	var req dto.SubscriptionCheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}
	userID, ok := r.Context().Value(middleware.UserContextKey).(string)
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	url, err := h.stripeSvc.CreateCheckoutSession(r.Context(), userID, req.Plan)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to create checkout session")
		http.Error(w, "failed to create checkout session", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"url": url}); err != nil {
		h.logger.Error().Err(err).Msg("failed to encode response")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
}

// Portal godoc
// @Summary Create a Stripe Customer Portal session
// @Description Generates a Stripe Customer Portal session URL for the authenticated user.
// @Tags subscriptions
// @Produce json
// @Success 200 {object} map[string]string "URL of the Customer Portal session"
// @Failure 401 {string} string "unauthorized"
// @Failure 500 {string} string "failed to create portal session"
// @Router /subscriptions/portal [get]
func (h *SubscriptionHandler) Portal(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserContextKey).(string)
	if !ok || userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	url, err := h.stripeSvc.CreatePortalSession(r.Context(), userID)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to create portal session")
		http.Error(w, "failed to create portal session", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"url": url}); err != nil {
		h.logger.Error().Err(err).Msg("failed to encode response")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
}
