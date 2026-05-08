DROP TABLE IF EXISTS Protocol CASCADE;
DROP TABLE IF EXISTS Pipeline CASCADE;
DROP TABLE IF EXISTS Processor CASCADE;
DROP TABLE IF EXISTS PipelineProcessor CASCADE;
DROP TABLE IF EXISTS MappingType CASCADE;
DROP TABLE IF EXISTS Mapping CASCADE;
DROP TABLE IF EXISTS SourceConfig CASCADE;


CREATE TABLE Protocol (
    UUID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

CREATE TABLE Pipeline (
    ID UUID PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT
);

CREATE TABLE Processor (
    ID UUID PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Schema JSONB
);

CREATE TABLE PipelineProcessor (
    ID UUID PRIMARY KEY,
    PipelineID UUID NOT NULL,
    ProcessorID UUID NOT NULL,
    Config JSONB NOT NULL,
    OrderInPipeline INT NOT NULL,
    HumanDescription TEXT,
    FOREIGN KEY (PipelineID) REFERENCES Pipeline(ID),
    FOREIGN KEY (ProcessorID) REFERENCES Processor(ID)
);

CREATE TABLE MappingType (
    ID UUID PRIMARY KEY,
    TypeName VARCHAR(50) NOT NULL UNIQUE,
    DisplayName VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Mapping (
    FieldName VARCHAR(255) PRIMARY KEY,
    FieldTypeID UUID NOT NULL,
    DefaultValue VARCHAR(255),
    FOREIGN KEY (FieldTypeID) REFERENCES MappingType(ID)
);

CREATE TABLE SourceConfig (
    ID UUID PRIMARY KEY,
    Port INT NOT NULL,
    Protocol VARCHAR(50) NOT NULL,
    Parser VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    PipelineID UUID NOT NULL,
    FOREIGN KEY (PipelineID) REFERENCES Pipeline(ID),
    UNIQUE (Port, Protocol)
);

INSERT INTO Protocol (Name) VALUES ('tcp'), ('udp');

-- processors
    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('cf01f20a-4fb6-4ddb-ae76-b5b44c8d697c', 'Set', 'Sets a value for a field', 
    '{"destination_field": "string", "value": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('186e047b-6327-4f35-bb91-7cd8e77ac69f', 'Delete', 'Deletes a field from the log entry', 
    '{"field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('546c8387-dcf7-4882-b2eb-f4ea8d854e68', 'Copy', 'Copies a value from one field to another', 
    '{"source_field": "string", "destination_field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('9573f9a8-a0a6-4db7-808e-024947224105', 'Call Pipeline', 'Calls another pipeline with the log entry', 
    '{"pipeline_id": "uuid"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('f5a6e7aa-6e5a-406c-a87f-503cedf20f69', 'Rename', 'Renames a field in the log entry', 
    '{"source_field": "string", "destination_field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('66d37f36-bbbd-4fd7-b8d9-9d112e76feff', 'Lowercase', 'Converts a field value to lowercase', 
    '{"field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('4dfad93f-ee9c-46c4-938e-2658d9635b2e', 'Uppercase', 'Converts a field value to uppercase', 
    '{"field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('442e331c-4b66-44b2-8292-1bc02f5e835d', 'Concat', 'Concatenates values from multiple fields', 
    '{"fields": ["string"], "destination_field": "string", "delimiter": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('d1e8c9a2-5b3f-4c6e-9f8a-7b2d3e4f5a6b', 'Regex Extract', 'Extracts a value from a field using a regular expression', 
    '{"field": "string", "regex": "string", "destination_field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'GeoIP Enrich', 'Enriches log entry with GeoIP information based on an IP field', 
    '{"ip_field": "string", "destination_field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('e7f8a9b0-c1d2-3e4f-5a6b-7c8d9e0f1a2b', 'Date Parse', 'Parses a date field into a standardized format', 
    '{"field": "string", "input_format": "string", "output_format": "string", "destination_field": "string"}');

    INSERT INTO Processor (ID, Name, Description, Schema) VALUES 
    ('9f0a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c', 'Drop', 'Drops the log entry if a field matches a certain value', 
    '{}');

-- pipelines
    INSERT INTO Pipeline (ID, Name, Description) VALUES 
    ('13acfea5-a7ec-4f51-aa4a-fd6949a9f42d', 'Default Pipeline', 'A default processing pipeline for network data.');

    INSERT INTO Pipeline (ID, Name, Description) VALUES 
    ('7b9c1d2e-3f4a-4b5c-8d6e-9f0a1b2c3d4e', 'Another Pipeline', 'Another processing pipeline for network data.');

-- mapping types
    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', 'int', 'Integer');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'float', 'Float');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'decimal', 'Decimal');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'date', 'Date');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'datetime', 'DateTime');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'time', 'Time');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES    
    ('7a8b9c0d-1e2f-3a4b-546d-7e8f9a0b1c2d', 'string', 'String');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'ipv4', 'IPv4');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'ipv6', 'IPv6');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', 'uuid', 'UUID');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b', 'bool', 'Boolean');

    INSERT INTO MappingType (ID, TypeName, DisplayName) VALUES 
    ('2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c', 'array', 'Array');


-- INSERT INTO SourceConfig (Port, Protocol, Parser, Name, PipelineID) VALUES 
-- (9001, 'udp', 'syslog_parser', 'Default Source', 1);