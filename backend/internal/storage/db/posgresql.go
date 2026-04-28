package db

import (
	"context"

	"backend/internal/model"

	"github.com/jackc/pgx/v5"
)

type PostgreSQLDB struct {
	// Add fields for PostgreSQL connection, e.g., connection pool
	conn *pgx.Conn // Placeholder for actual connection type
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
	conn, err := pgx.Connect(context.Background(),
		"postgres://siem:siem@postgres:5432/siem")
	if err != nil {
		return err
	}
	db.conn = conn

	err = db.Ping()
	if err != nil {
		return err
	}
	return nil
}

func (db *PostgreSQLDB) Ping() error {
	// Implement ping logic to check PostgreSQL connection
	err := db.conn.Ping(context.Background())
	return err
}

func (db *PostgreSQLDB) GetVersion() (string, error) {
	// Implement logic to get PostgreSQL version
	var version string
	err := db.conn.QueryRow(context.Background(), "SELECT version()").Scan(&version)
	if err != nil {
		return "", err
	}
	return version, nil
}

// Implement other methods for interacting with PostgreSQL as needed
func (db *PostgreSQLDB) GetSourcesFromDB() ([]model.SourceConfig, error) {
	// Implement logic to retrieve sources from PostgreSQL
	rows, err := db.conn.Query(context.Background(), `
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

func (db *PostgreSQLDB) AddSourceToDB(source model.SourceConfig) (int, error) {
	// Implement logic to add a source to PostgreSQL
	var id int
	err := db.conn.QueryRow(context.Background(),
		"INSERT INTO SourceConfig (protocol, port, parser, name, pipelineid) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		source.Protocol, source.Port, source.Parser, source.Name, source.PipelineID).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *PostgreSQLDB) DeleteSourceFromDB(sourceID int) error {
	// Implement logic to delete a source from PostgreSQL
	return nil
}

func (db *PostgreSQLDB) ClearSourcesFromDB() error {
	// Implement logic to clear all sources from PostgreSQL
	return nil
}
