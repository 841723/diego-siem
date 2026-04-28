DROP TABLE IF EXISTS SourceConfig;
DROP TABLE IF EXISTS PipelineProcessors;
DROP TABLE IF EXISTS Pipelines;
DROP TABLE IF EXISTS Protocols;

CREATE TABLE Protocols (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);
INSERT INTO Protocols (Name) VALUES ('tcp'), ('udp');


CREATE TABLE Pipelines (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT
);

CREATE TABLE PipelineProcessors (
    ID SERIAL PRIMARY KEY,
    PipelineID INT,
    ProcessorName VARCHAR(255),
    Config JSONB,
    FOREIGN KEY (PipelineID) REFERENCES Pipelines(ID)
);

CREATE TABLE SourceConfig (
    ID SERIAL PRIMARY KEY,
    Port INT NOT NULL,
    Protocol VARCHAR(50) NOT NULL,
    Parser VARCHAR(255) NOT NULL,
    Name VARCHAR(255) NOT NULL,
    PipelineID INT NOT NULL,
    FOREIGN KEY (PipelineID) REFERENCES Pipelines(ID)
);

INSERT INTO Pipelines (Name, Description) VALUES 
('Default Pipeline', 'A default processing pipeline for network data.');

-- INSERT INTO SourceConfig (Port, Protocol, Parser, Name, PipelineID) VALUES 
-- (9001, 'udp', 'syslog_parser', 'Default Source', 1);