FROM golang:1.15

WORKDIR /go/src/app
COPY . . 
COPY minimal-config.json config.json

RUN go get -d -v ./...
RUN go install -v ./...

EXPOSE 9000
CMD ["goshoutbox"]

