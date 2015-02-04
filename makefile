all: run

clean:
	-rm -Rf build
	-rm -f rollupthestats

dependencies:
	godep get

run: clean dependencies
	godep go run main.go

save:
	godep save

test: clean
	go test ./...

package: clean dependencies
	mkdir build
	godep go build
	mv rollupthestats build/
