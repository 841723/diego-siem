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
    Config JSONB
);

CREATE TABLE PipelineProcessor (
    ID UUID PRIMARY KEY,
    PipelineID UUID NOT NULL,
    ProcessorID UUID NOT NULL,
    Config JSONB,
    FOREIGN KEY (PipelineID) REFERENCES Pipeline(ID),
    FOREIGN KEY (ProcessorID) REFERENCES Processor(ID)
);

CREATE TABLE MappingType (
    ID UUID PRIMARY KEY,
    TypeName VARCHAR(50)
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

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('cf01f20a-4fb6-4ddb-ae76-b5b44c8d697c', 'Set', 'Sets a value for a field', 
 '{"destination_field": "string", "value": "string"}');

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('186e047b-6327-4f35-bb91-7cd8e77ac69f', 'Drop', 'Drops a field from the log entry', 
 '{"field": "string"}');

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('546c8387-dcf7-4882-b2eb-f4ea8d854e68', 'Copy', 'Copies a value from one field to another', 
 '{"source_field": "string", "destination_field": "string"}');

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('9573f9a8-a0a6-4db7-808e-024947224105', 'Call Pipeline', 'Calls another pipeline with the log entry', 
 '{"pipeline_id": "uuid"}');

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('f5a6e7aa-6e5a-406c-a87f-503cedf20f69', 'Rename', 'Renames a field in the log entry', 
 '{"source_field": "string", "destination_field": "string"}');

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('66d37f36-bbbd-4fd7-b8d9-9d112e76feff', 'Lowercase', 'Converts a field value to lowercase', 
 '{"field": "string"}');

 INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('4dfad93f-ee9c-46c4-938e-2658d9635b2e', 'Uppercase', 'Converts a field value to uppercase', 
 '{"field": "string"}');

INSERT INTO Processor (ID, Name, Description, Config) VALUES 
('442e331c-4b66-44b2-8292-1bc02f5e835d', 'Concat', 'Concatenates values from multiple fields', 
 '{"fields": ["string"], "destination_field": "string", "delimiter": "string"}');


INSERT INTO Pipeline (ID, Name, Description) VALUES 
('13acfea5-a7ec-4f51-aa4a-fd6949a9f42d', 'Default Pipeline', 'A default processing pipeline for network data.');

INSERT INTO Pipeline (ID, Name, Description) VALUES 
('7b9c1d2e-3f4a-4b5c-8d6e-9f0a1b2c3d4e', 'Another Pipeline', 'Another processing pipeline for network data.');

-- INSERT INTO SourceConfig (Port, Protocol, Parser, Name, PipelineID) VALUES 
-- (9001, 'udp', 'syslog_parser', 'Default Source', 1);