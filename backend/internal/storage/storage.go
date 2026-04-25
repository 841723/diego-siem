package storage

import (
	"backend/internal/model"
	"backend/internal/storage/db"
)

type Storage struct {
	clickhouse *db.ClickHouseDB
	postgres   *db.PostgreSQLDB
}

func NewStorage() *Storage {
	return &Storage{
		clickhouse: db.NewClickHouseDB(),
		postgres:   db.NewPostgreSQLDB(),
	}
}

func (s *Storage) StoreLog(log model.Log) error {
	return s.clickhouse.LogToDB(log)
}

func (s *Storage) GetLogs(logID string) ([]model.Log, error) {
	return s.clickhouse.GetLogsFromDB(logID)
}

func (s *Storage) DeleteLogs() error {
	return s.clickhouse.DeleteLogsFromDB()
}

func (s *Storage) GetSources() ([]model.SourceConfig, error) {
	return s.postgres.GetSourcesFromDB()
}

func (s *Storage) AddSource(source model.SourceConfig) error {
	return s.postgres.AddSourceToDB(source)
}

func (s *Storage) DeleteSource(sourceID string) error {
	return s.postgres.DeleteSourceFromDB(sourceID)
}

func (s *Storage) ClearSources() error {
	return s.postgres.ClearSourcesFromDB()
}