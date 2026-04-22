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

func StoreLog(log model.Log) error {
	if mainStorage == nil {
		mainStorage = NewStorage()
	}

	mainStorage.db.LogToDB(log)
	return nil
}
