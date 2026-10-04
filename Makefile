IMAGE_NAME ?= typescript-mcp-template
IMAGE_TAG  ?= latest

.PHONY: install build test run clean rebuild docker-build

install:
	npm install

build:
	npm run build

test:
	npm test

run: build
	npm start

clean:
	rm -rf dist/

rebuild: clean build

docker-build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
