package storage

import (
	"backend/internal/model"
	"backend/internal/storage/db"
)

type Storage struct {
	db db.ClickHouseDB
}

func NewStorage() *Storage {
	return &Storage{
		db: *db.NewClickHouseDB(),
	}
}

var mainStorage *Storage

func checkStorage() {
	if mainStorage == nil {
		mainStorage = NewStorage()
	}
}

func StoreLog(log model.Log) error {
	checkStorage()
	mainStorage.db.LogToDB(log)
	return nil
}

func GetLogs(logID string) ([]model.Log, error) {
	checkStorage()

	return mainStorage.db.GetLogsFromDB(logID)
}

func DeleteLogs() error {
	checkStorage()

	return mainStorage.db.DeleteLogsFromDB()
}