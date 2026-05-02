DROP TABLE IF EXISTS SourceConfig;
DROP TABLE IF EXISTS PipelineProcessors;
DROP TABLE IF EXISTS Pipelines;
DROP TABLE IF EXISTS Protocols;

CREATE TABLE Protocols (
    UUID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);
INSERT INTO Protocols (Name) VALUES ('tcp'), ('udp');


CREATE TABLE Pipelines (
    ID UUID PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT
);

CREATE TABLE PipelineProcessors (
    ID UUID PRIMARY KEY,
    PipelineID UUID NOT NULL,
    ProcessorName VARCHAR(255),
    Config JSONB,
    FOREIGN KEY (PipelineID) REFERENCES Pipelines(ID)
);

CREATE TABLE SourceConfig (
    ID UUID PRIMARY KEY,
    Port INT NOT NULL,
    Protocol VARCHAR(50) NOT NULL,
    Parser VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    PipelineID UUID NOT NULL,
    FOREIGN KEY (PipelineID) REFERENCES Pipelines(ID),
    UNIQUE (Port, Protocol)
);

INSERT INTO Pipelines (ID, Name, Description) VALUES 
('13acfea5-a7ec-4f51-aa4a-fd6949a9f42d', 'Default Pipeline', 'A default processing pipeline for network data.');

INSERT INTO Pipelines (ID, Name, Description) VALUES 
('7b9c1d2e-3f4a-4b5c-8d6e-9f0a1b2c3d4e', 'Another Pipeline', 'Another processing pipeline for network data.');

-- INSERT INTO SourceConfig (Port, Protocol, Parser, Name, PipelineID) VALUES 
-- (9001, 'udp', 'syslog_parser', 'Default Source', 1);