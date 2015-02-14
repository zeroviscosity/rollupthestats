package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type Geo struct {
	City    string `json:"city"`
	Region  string `json:"region"`
	Country string `json:"country"`
}

func GeoHandler(db *sql.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		q := `SELECT ip
			FROM logs 
			WHERE ip != ''
			AND city IS NULL
			AND province IS NULL
			AND country IS NULL
			LIMIT 1`
		var ip string
		row := db.QueryRow(q)
		err := row.Scan(&ip)
		if err != nil {
			fmt.Printf("Error during geo SELECT query: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		url := fmt.Sprintf("http://www.telize.com/geoip/%s", ip)
		res, err := http.Get(url)
		if err != nil {
			fmt.Printf("Error during geo GET call: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		defer res.Body.Close()
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			fmt.Printf("Error reading geo response: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		var geo Geo
		err = json.Unmarshal(body, &geo)
		if err != nil {
			fmt.Printf("Error parsing geo JSON: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		if geo.City == "" {
			geo.City = "NA"
		}
		if geo.Region == "" {
			geo.Region = "NA"
		}
		if geo.Country == "" {
			geo.Country = "NA"
		}

		q = "UPDATE logs SET city = ?, province = ?, country = ? WHERE ip = ?"
		_, err = db.Exec(q, geo.City, geo.Region, geo.Country, ip)
		if err != nil {
			fmt.Printf("Error updating record with geo data: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		fmt.Fprintf(w, "OK")
	}
}
