# docker-magento-2
Docker to Magento 2

## Use
- Clone the repository
- Change the "STORE_PREFIX" in .env file if you want
- Run it with docker-compose up -d

## General info
- This is a Magento 2 environment image with Docker and Docker Compose.
- It was built to be used in each store individually.
If you want to install more than one store, clone this repository as many times as necessary, change the directory name and the store prefix in the .env file.

  
### Include:
- MySql 5.7
- Elastic Search 7.10.1
- PHP 7.4-fpm
- Composer v1
- Node
- Grunt
- Xdebug 3
- Redis
- Mailhog
- Nginx

You can also change all stack versions if you want.. Tested and approved with all Magento 2 versions!
 
 # Make good use of it! ;D
