# diego-siem

This is a SIEM (Security Information and Event Management) system built using Go for the backend and ClickHouse as the database. 

## Goal
The goal is to learn how to build a SIEM system from scratch, understand the components involved, and gain experience with Go and ClickHouse. The system is designed to be simple and modular, allowing for easy extension and improvement in the future.

The system collects logs from various sources, stores them in ClickHouse, and provides a web interface for querying and visualizing the logs. It also allows users to set up alerts based on specific log patterns.

## Getting Started

To run the system, you can use Docker Compose. Make sure you have Docker and Docker Compose installed on your machine.

1. Clone the repository:
   ```bash
    git clone https://github.com/841723/diego-siem
    cd diego-siem
    ```

2. Start the services:
    ```bash
    docker-compose up --build
    ```

3. Access the web interface:

    Open your browser and navigate to [http://localhost:5173](http://localhost:5173) to see the logs.
    
    Database UI is accessible at [http://localhost:8123](http://localhost:8123) and credentials are `default:default`.
     
    Backend API is accessible at [http://localhost:8080](http://localhost:8080).
    
    The log generator is sending logs to the backend at [udp://backend:9001](udp://backend:9001).
    

4. Feel free to explore and give feedback or contribute to the project!


## Future Improvements

- Implement the alerting system to allow users to set up alerts based on specific log patterns.
- Add support for more log sources, such as syslog, file-based logs, or cloud services.
- Enhance the web interface with more advanced querying capabilities and visualizations.
- Implement authentication and authorization for the web interface and API.
- Optimize the log storage and querying performance in ClickHouse.
