package db

import (
	"context"
	"errors"
	"time"

	"backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgreSQLDB struct {
	// Add fields for PostgreSQL connection, e.g., connection pool
	pool *pgxpool.Pool
}

func NewPostgreSQLDB() *PostgreSQLDB {
	// Initialize and return a new PostgreSQLDB instance
	db := &PostgreSQLDB{}

	if err := db.connect(); err != nil {
		panic("Error connecting to PostgreSQL: " + err.Error())
	}
	return db
}

func (db *PostgreSQLDB) connect() error {
	// Implement connection logic to PostgreSQL
	// postgres://postgres://siem:siem@postgres:5432/siem?pool_max_conns=10
	config, _ := pgxpool.ParseConfig("user=siem password=siem host=postgres port=5432 dbname=siem pool_max_conns=10")

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return err
	}
	db.pool = pool

	err = db.Ping()
	if err != nil {
		return err
	}
	return nil
}

func (db *PostgreSQLDB) Ping() error {
	// Implement ping logic to check PostgreSQL connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := db.pool.Ping(ctx)
	return err
}

func (db *PostgreSQLDB) GetVersion() (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Implement logic to get PostgreSQL version
	var version string
	err := db.pool.QueryRow(ctx, "SELECT version()").Scan(&version)
	if err != nil {
		return "", err
	}
	return version, nil
}

// Implement other methods for interacting with PostgreSQL as needed
func (db *PostgreSQLDB) GetSourcesFromDB() ([]model.SourceConfig, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// Implement logic to retrieve sources from PostgreSQL
	rows, err := db.pool.Query(ctx, `
		SELECT id, port, protocol, parser, name, pipelineid
		FROM sourceconfig
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sources []model.SourceConfig

	for rows.Next() {
		var s model.SourceConfig

		err := rows.Scan(
			&s.ID,
			&s.Port,
			&s.Protocol,
			&s.Parser,
			&s.Name,
			&s.PipelineID,
		)
		if err != nil {
			return nil, err
		}

		sources = append(sources, s)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return sources, nil
}

func (db *PostgreSQLDB) GetSourceByIDFromDB(id model.ID) (*model.SourceConfig, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var s model.SourceConfig

	err := db.pool.QueryRow(ctx, `
		SELECT id, port, protocol, parser, name, pipelineid
		FROM sourceconfig
		WHERE id = $1
	`, id).Scan(
		&s.ID,
		&s.Port,
		&s.Protocol,
		&s.Parser,
		&s.Name,
		&s.PipelineID,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (db *PostgreSQLDB) GetSourceByPortAndProtocolFromDB(port int, protocol string) (*model.SourceConfig, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var s model.SourceConfig

	err := db.pool.QueryRow(ctx, `
		SELECT id, port, protocol, parser, name, pipelineid
		FROM sourceconfig
		WHERE port = $1 AND protocol = $2
	`, port, protocol).Scan(
		&s.ID,
		&s.Port,
		&s.Protocol,
		&s.Parser,
		&s.Name,
		&s.PipelineID,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (db *PostgreSQLDB) AddSourceToDB(source model.SourceConfig) (model.ID, error) {
	//
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var id model.ID
	err := db.pool.QueryRow(ctx,
		"INSERT INTO SourceConfig (ID, protocol, port, parser, name, pipelineid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		source.ID, source.Protocol, source.Port, source.Parser, source.Name, source.PipelineID).Scan(&id)
	if err != nil {
		return model.GenerateErrorUUID(), err
	}
	return id, nil
}

func (db *PostgreSQLDB) UpdateSourceInDB(source model.SourceConfig) error {
	// Implement logic to update a source in PostgreSQL
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"UPDATE SourceConfig SET protocol = $1, port = $2, parser = $3, name = $4, pipelineid = $5 WHERE id = $6",
		source.Protocol, source.Port, source.Parser, source.Name, source.PipelineID, source.ID)
	return err
}

func (db *PostgreSQLDB) DeleteSourceFromDB(sourceID model.ID) error {
	// Implement logic to delete a source from PostgreSQL
	return nil
}

func (db *PostgreSQLDB) ClearSourcesFromDB() error {
	// Implement logic to clear all sources from PostgreSQL
	return nil
}

func (db *PostgreSQLDB) DeleteSourceByIDFromDB(sourceID model.ID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM SourceConfig WHERE id = $1",
		sourceID)
	return err
}
