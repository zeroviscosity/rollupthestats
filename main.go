package main

import (
	"log"
	"net/http"

	"github.com/zeroviscosity/rollupthestats/handlers"
)

func main() {
	http.HandleFunc("/log", handlers.LogHandler)
	http.HandleFunc("/stats", handlers.StatsHandler)

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	log.Println("Listening on 0.0.0.0:3007")
	http.ListenAndServe(":3007", nil)
}
