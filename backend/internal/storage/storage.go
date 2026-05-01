package storage

import (
	"fmt"

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

func (s *Storage) GetLogs(params model.GetLogsParams) ([]model.Log, error) {
	var err error
	// params.TimestampFrom, params.TimestampTo, err = lib.ClickHouse_FormatTimeWindow(params.TimeWindow)
	fmt.Printf("Received GetLogs request with TimeWindow: %s\n", params.TimeWindow)
	if err != nil {
		return nil, fmt.Errorf("failed to format time window: %w", err)
	}
	return s.clickhouse.GetLogsFromDB(params)
}

func (s *Storage) CountLogs(params model.GetLogsParams) (int, error) {
	return s.clickhouse.CountLogsFromDB(params)
}

func (s *Storage) DeleteLogs() error {
	return s.clickhouse.DeleteLogsFromDB()
}

func (s *Storage) GetSources() ([]model.SourceConfig, error) {
	return s.postgres.GetSourcesFromDB()
}

func (s *Storage) GetSourceByID(id int) (*model.SourceConfig, error) {
	return s.postgres.GetSourceByIDFromDB(id)
}

func (s *Storage) GetSourceByPortAndProtocol(port int, protocol string) (*model.SourceConfig, error) {
	return s.postgres.GetSourceByPortAndProtocolFromDB(port, protocol)
}

func (s *Storage) AddSource(source model.SourceConfig) (int, error) {
	return s.postgres.AddSourceToDB(source)
}

func (s *Storage) UpdateSource(source model.SourceConfig) error {
	return s.postgres.UpdateSourceInDB(source)
}

func (s *Storage) DeleteSource(sourceID int) error {
	return s.postgres.DeleteSourceFromDB(sourceID)
}

func (s *Storage) ClearSources() error {
	return s.postgres.ClearSourcesFromDB()
}

func (s *Storage) DeleteSourceByID(sourceID int) error {
	return s.postgres.DeleteSourceByIDFromDB(sourceID)
}
