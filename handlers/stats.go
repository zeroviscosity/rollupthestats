package handlers

import (
	"fmt"
	"net/http"
)

func StatsHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.RemoteAddr)
	fmt.Fprintf(w, "stats")
}
