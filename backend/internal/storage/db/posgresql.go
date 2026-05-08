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

/*
*******************************************************

	Pipelines

*******************************************************
*/
func (db *PostgreSQLDB) AddPipelineToDB(pipeline model.Pipeline) (model.ID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var id model.ID
	err := db.pool.QueryRow(ctx,
		"INSERT INTO Pipeline (ID, name, description) VALUES ($1, $2, $3) RETURNING id",
		pipeline.ID, pipeline.Name, pipeline.Description).Scan(&id)
	if err != nil {
		return model.GenerateErrorUUID(), err
	}
	return id, nil
}

func (db *PostgreSQLDB) GetPipelinesFromDB() ([]model.Pipeline, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// Implement logic to retrieve pipelines from PostgreSQL
	rows, err := db.pool.Query(ctx, `
		SELECT id, name, description
		FROM pipeline
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pipelines []model.Pipeline

	for rows.Next() {
		var p model.Pipeline

		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
		)
		if err != nil {
			return nil, err
		}

		pipelines = append(pipelines, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return pipelines, nil
}

func (db *PostgreSQLDB) GetPipelineByIDFromDB(id model.ID) (*model.Pipeline, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p model.Pipeline

	err := db.pool.QueryRow(ctx, `
		SELECT id, name, description
		FROM pipeline
		WHERE id = $1
	`, id).Scan(
		&p.ID,
		&p.Name,
		&p.Description,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &p, nil
}

func (db *PostgreSQLDB) UpdatePipelineInDB(pipeline model.Pipeline) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"UPDATE Pipeline SET name = $1, description = $2 WHERE id = $3",
		pipeline.Name, pipeline.Description, pipeline.ID)
	return err
}

func (db *PostgreSQLDB) DeletePipelineFromDB(pipelineID model.ID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM Pipeline WHERE id = $1",
		pipelineID)
	return err
}

func (db *PostgreSQLDB) ClearPipelinesFromDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM Pipeline")
	return err
}

func (db *PostgreSQLDB) DeletePipelineByIDFromDB(pipelineID model.ID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM Pipeline WHERE id = $1",
		pipelineID)
	return err
}

func (db *PostgreSQLDB) GetSubPipelinesFromDB(pipelineID model.ID) ([]model.ID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	rows, err := db.pool.Query(ctx, `
		select *
		from pipelineprocessor p 
		join (
			select id 
			from processor 
			where name LIKE 'Call Pipeline'
			) p2 
		on p.processorid = p2.id 
		where p.pipelineid = $1
	`, pipelineID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subPipelineIDs []model.ID

	for rows.Next() {
		var processorID model.ID

		err := rows.Scan(&processorID)
		if err != nil {
			return nil, err
		}

		subPipelineIDs = append(subPipelineIDs, processorID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return subPipelineIDs, nil
}

/*
******************************************************

	Processors

*******************************************************
*/

func (db *PostgreSQLDB) GetProcessorsFromDB() ([]model.Processor, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	rows, err := db.pool.Query(ctx, `
		SELECT id, name, description, schema
		FROM processor
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var processors []model.Processor

	for rows.Next() {
		var p model.Processor

		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Schema,
		)
		if err != nil {
			return nil, err
		}

		processors = append(processors, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return processors, nil
}

func (db *PostgreSQLDB) GetProcessorByIDFromDB(id model.ID) (*model.Processor, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p model.Processor

	err := db.pool.QueryRow(ctx, `
		SELECT id, name, description, schema
		FROM processor
		WHERE id = $1
	`, id).Scan(
		&p.ID,
		&p.Name,
		&p.Description,
		&p.Schema,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &p, nil
}

func (db *PostgreSQLDB) GetProcessorByNameFromDB(name string) (*model.Processor, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var p model.Processor

	err := db.pool.QueryRow(ctx, `
		SELECT id, name, description, schema
		FROM processor
		WHERE name = $1
	`, name).Scan(
		&p.ID,
		&p.Name,
		&p.Description,
		&p.Schema,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &p, nil
}

func (db *PostgreSQLDB) GetProcessorsByIDFromDB(processorID model.ID) ([]model.Processor, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := db.pool.Query(ctx, `
		SELECT id, name, description, schema
		FROM processor
		WHERE id = $1
	`, processorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var processors []model.Processor

	for rows.Next() {
		var p model.Processor

		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Schema,
		)
		if err != nil {
			return nil, err
		}

		processors = append(processors, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return processors, nil
}

/*
******************************************************

	Pipeline Processors

*******************************************************
*/

func (db *PostgreSQLDB) AddProcessorToPipelineInDB(processor model.PipelineProcessor) (model.ID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var id model.ID
	err := db.pool.QueryRow(ctx,
		"INSERT INTO PipelineProcessor (ID, pipelineid, processorid, config, orderinpipeline) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		processor.ID, processor.PipelineID, processor.ProcessorID, processor.Config, processor.OrderInPipeline).Scan(&id)
	if err != nil {
		return model.GenerateErrorUUID(), err
	}
	return id, nil
}

func (db *PostgreSQLDB) GetProcessorsFromPipelineInDB(pipelineID model.ID) ([]model.PipelineProcessor, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	rows, err := db.pool.Query(ctx, `
		SELECT pipelineprocessor.id, pipelineprocessor.pipelineid, pipelineprocessor.processorid, pipelineprocessor.config, pipelineprocessor.orderinpipeline, processor.id, processor.name, processor.description, processor.schema, pipeline.id, pipeline.name, pipeline.description
		FROM pipelineprocessor
		JOIN processor ON pipelineprocessor.processorid = processor.id
		JOIN pipeline ON pipelineprocessor.pipelineid = pipeline.id
		WHERE pipelineprocessor.pipelineid = $1
	`, pipelineID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var processors []model.PipelineProcessor

	for rows.Next() {
		var p model.PipelineProcessor

		err := rows.Scan(
			&p.ID,
			&p.PipelineID,
			&p.ProcessorID,
			&p.Config,
			&p.OrderInPipeline,
			&p.Processor.ID,
			&p.Processor.Name,
			&p.Processor.Description,
			&p.Processor.Schema,
			&p.Pipeline.ID,
			&p.Pipeline.Name,
			&p.Pipeline.Description,
		)
		if err != nil {
			return nil, err
		}

		processor, err := db.GetProcessorByIDFromDB(p.ProcessorID)
		if err != nil {
			return nil, err
		}
		p.Processor = *processor
		pipeline, err := db.GetPipelineByIDFromDB(p.PipelineID)
		if err != nil {
			return nil, err
		}
		p.Pipeline = *pipeline

		processors = append(processors, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return processors, nil
}

func (db *PostgreSQLDB) UpdateProcessorInPipelineInDB(processor model.PipelineProcessor) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"UPDATE PipelineProcessor SET processorid = $1, config = $2, orderinpipeline = $3 WHERE id = $4 AND pipelineid = $5",
		processor.ProcessorID, processor.Config, processor.OrderInPipeline, processor.ID, processor.PipelineID)
	return err
}

func (db *PostgreSQLDB) DeleteProcessorFromPipelineInDB(processorID model.ID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM PipelineProcessor WHERE id = $1",
		processorID)
	return err
}

func (db *PostgreSQLDB) ClearProcessorsFromPipelineInDB(pipelineID model.ID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM PipelineProcessor WHERE pipelineid = $1",
		pipelineID)
	return err
}

/*
******************************************************

	Mappings

*******************************************************
*/
func (db *PostgreSQLDB) AddMappingToDB(mapping model.Mapping) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.pool.Exec(ctx,
		"INSERT INTO Mapping (FieldName, FieldTypeID, DefaultValue) VALUES ($1, $2, $3)",
		mapping.FieldName, mapping.FieldTypeID, mapping.DefaultValue)
	return err
}

func (db *PostgreSQLDB) GetMappingsFromDB() ([]model.Mapping, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	rows, err := db.pool.Query(ctx, `
		SELECT fieldname, fieldtypeid, defaultvalue
		FROM mapping
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mappings []model.Mapping

	for rows.Next() {
		var m model.Mapping

		err := rows.Scan(
			&m.FieldName,
			&m.FieldTypeID,
			&m.DefaultValue,
		)
		if err != nil {
			return nil, err
		}

		mappings = append(mappings, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return mappings, nil
}

func (db *PostgreSQLDB) DeleteMappingsFromDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.pool.Exec(ctx,
		"DELETE FROM Mapping WHERE true")
	return err
}

/*
******************************************************

	Mapping Types

******************************************************
*/

func (db *PostgreSQLDB) GetMappingTypesFromDB() ([]model.MappingType, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	rows, err := db.pool.Query(ctx, `
		SELECT id, typename, displayname
		FROM mappingtype
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var types []model.MappingType

	for rows.Next() {
		var t model.MappingType

		err := rows.Scan(&t.ID, &t.TypeName, &t.DisplayName)
		if err != nil {
			return nil, err
		}

		types = append(types, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return types, nil
}

func (db *PostgreSQLDB) IsValidMappingType(dataType string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var id model.ID
	err := db.pool.QueryRow(ctx,
		"SELECT id FROM MappingType WHERE typename = $1",
		dataType).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
