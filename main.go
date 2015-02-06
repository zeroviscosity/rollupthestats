package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/kelseyhightower/envconfig"
	"github.com/zeroviscosity/rollupthestats/handlers"

	_ "github.com/go-sql-driver/mysql"
)

type Config struct {
	User     string `envconfig:"MYSQL_USER"`
	Password string `envconfig:"MYSQL_PASSWORD"`
	Name     string `envconfig:"MYSQL_NAME"`
}

func main() {
	var config Config
	err := envconfig.Process("MYSQL", &config)
	if err != nil {
		log.Fatalf("Error reading environment variables: %s\n", err.Error())
	}

	db, err := sql.Open("mysql",
		fmt.Sprintf("%s:%s@/%s", config.User, config.Password, config.Name))
	if err != nil {
		log.Fatalf("Error establishing database connection: %s\n", err.Error())
	}
	err = db.Ping()
	if err != nil {
		log.Fatalf("Error opening database connection: %s\n", err.Error())
	}

	http.HandleFunc("/api/logs", handlers.LogHandler(db))
	http.HandleFunc("/api/stats", handlers.StatsHandler(db))

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	log.Println("Listening on 0.0.0.0:3007")
	http.ListenAndServe(":3007", nil)
}
