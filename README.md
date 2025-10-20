# Project Build Instructions

Follow these steps to build and run the application using Docker.

## Prerequisites

Make sure you have **Docker** and **Docker Compose** installed on your computer.

## Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone <repo_code>
    ```

2.  **Initialize the Database**
    Create the database by running the `init.sql` script located in the `database` folder.

3.  **Create Configuration File**
    Create an `application.properties` file under the `backend/src/main/resources` directory.

## Running the Application

1.  **Navigate to Project Root**
    Change your directory to the project's root folder:
    ```bash
    cd /path/to/bounswe2025group5
    ```

2.  **Build and Run Services**
    Use Docker Compose to build the images and start the frontend and backend services.
    ```bash
    docker-compose up --build
    ```

3.  **Verify Containers**
    Check if the containers are running correctly.
    ```bash
    docker ps -as
    ```

4.  **Access the Application**
    Open your browser and navigate to:
    `http://localhost:3000`

## Local Development (Optional)

The URL at frontend is "https://waste-less.alibartukonca.org" . If you wish to run the backend  on your local machine, you must change the configuration in the frontend code to send API requests to `http://localhost:8080`.

## Troubleshooting

To view the logs for a specific running container:
```bash
docker-compose logs <container_name_or_id>
