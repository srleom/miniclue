package logger

import (
	"os"

	"github.com/rs/zerolog"
)

func New() zerolog.Logger {
	// For Google Cloud Logging, the level field name should be "severity".
	// This allows Cloud Logging to automatically parse the log level.
	zerolog.LevelFieldName = "severity"

	// Set global time format to RFC3339
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()

	// Use ConsoleWriter for local development for more readable logs.
	if os.Getenv("ENV") == "development" {
		logger = logger.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	return logger.Level(zerolog.DebugLevel) // TODO: change to InfoLevel in production
}
