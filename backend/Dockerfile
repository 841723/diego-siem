FROM golang:latest

WORKDIR /app

RUN go install github.com/air-verse/air@latest

COPY . .

CMD ["air"]