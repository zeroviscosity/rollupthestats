package handlers

import (
	"fmt"
	"net/http"
)

func LogHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "log")
}
