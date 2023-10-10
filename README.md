<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">

## Description

Nest REST API with auth configuration and user registration CRUD with DynanoDB, and DynanoDB customized service to run on AWS Lambda

## Installation

```bash
$ yarn install
```

## Running the app

Create table `usuarios` with primary key `userId` global indexes `email-index`, `empresaId-index`.

Create table `empresas` with primary key `empresaId` 

Make de yml file and deploy it on AWS Lambda

```bash
# development
$ yarn build
$ serverless deploy

```
