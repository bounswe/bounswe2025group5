# Project Build Instructions

Follow these steps to build and run the application using Docker.


## Prerequisites (This part is for Ubuntu, steps might change for other Operating Systems)

Make sure you have **Docker** and **Docker Compose** installed on your computer.
- Install them with :
    * update to refresh local list of available software from the default Ubuntu servers.
    * install curl and ca-certificates to be able to install docker from the Internet
    ```bash
    sudo apt-get update
    sudo apt-get install ca-certificates curl -y
    ```
    * create a directory called  keyrings to store security keys.
    * downloads Docker's official GPG key (digital signature) from their website and saves it to your computer. 
    * change permissions so that "all" users  can "read" this key
    ```bash
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    ```
    add Docker's download server to your computer's "Address Book" of software.

    ```bash
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
    * refresh the list again,  then install the actual Docker packages.
    ```bash
    sudo apt-get update
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
       ```
    * test whether it is work or not with running a example container
    ```bash
    sudo docker run hello-world
    ```
## Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/bounswe/bounswe2025group5.git
    
    ```


2.  **Configuration Files**
    * VITE_API_URL will be used at frontend container, you need to put that to env, the other ones are for backend container.
    * the application uses space object for the photos of profiles and posts, our suggesstion is creation of space object on digital ocean [website](https://www.digitalocean.com/products/spaces) , if you do not want to deal with it, please reach us and request the credentials.
    * The **application.properties** file works with the .env file in the root directory. You need to assign values to these variables: 
    ```bash
    nano .env   # at bounswe2025group5 directory
    ```
    * .envfile 
    ```bash
    # Database Configuration
    DB_HOST=<ip-address-of-your-db>
    DB_USERNAME=<db-username>
    DB_PASSWORD=<db-password>

    #DigitalOcean Spaces Configuration

    DO_SPACES_ACCESS_KEY=<digital-ocean-space-object-key>
    DO_SPACES_SECRET_KEY=<digital-ocean-space-object-secret-key>
    DO_SPACES_BUCKET_NAME=<digital-ocean-space-object-bucket-name>
    DO_SPACES_REGION=<digital-ocean-space-object-region>
    DO_SPACES_PHOTO_FOLDER=<digital-ocean-space-object-photo-folder-name>
    DO_SPACES_POST_PHOTO_FOLDER=<digital-ocean-space-object-post-photo-folder-name>
    # qdrant container host name 
    QDRANT_HOST=qdrant-db
    VITE_API_URL= <ip-address-of-your-backend-service>
     ```


## Running the Application

1.  **Navigate to Project Root**
    Change your directory to the project's root folder:
    ```bash
    cd /path/to/bounswe2025group5
    ```

2.  **Build and Run Services**
    Use Docker Compose to build the images and start the frontend and backend services.
    ```bash
    docker-compose up -d --build
    ```

3.  **Verify Containers**
    Check if the containers are running correctly.
    ```bash
    docker ps -as
    ```

4.  **Access the Application**
    Open your browser and navigate to:
    `http://localhost:3000`

#
## Troubleshooting

To view the logs for a specific running container:
```bash
docker-compose logs <container_name_or_id>
```
## Running the Application For Mobile
- If you run backend correctly, now the mobile apk will also use that backend , the configurations are:
   ```bash
      cd mobile
      nano .env
     ```
    * put EXPO_PUBLIC_API_BASE_URL value to it.
     ```bash
      docker build -t mobile-apk .
      docker create --name mobile-apk mobile-apk
       docker cp mobile-apk:/app/artifacts/app-debug.apk ./app-standalone.apk
  ```
-  With these commands, you will get apk at your mobile directory.


