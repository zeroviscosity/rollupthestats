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
	Token    string `envconfig:"APP_TOKEN"`
}

func main() {
	var config Config
	err := envconfig.Process("", &config)
	if err != nil {
		log.Fatalf("Error reading environment variables: %s", err.Error())
	}

	db, err := sql.Open("mysql",
		fmt.Sprintf("%s:%s@/%s", config.User, config.Password, config.Name))
	if err != nil {
		log.Fatalf("Error establishing database connection: %s", err.Error())
	}
	err = db.Ping()
	if err != nil {
		log.Fatalf("Error opening database connection: %s", err.Error())
	}

	http.HandleFunc("/api/logs", handlers.LogHandler(db))
	http.HandleFunc("/api/stats", handlers.StatsHandler(db))
	http.HandleFunc(fmt.Sprintf("/api/geo/%s", config.Token), handlers.GeoHandler(db))

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	log.Println("Listening on 0.0.0.0:3007")
	http.ListenAndServe(":3007", nil)
}
