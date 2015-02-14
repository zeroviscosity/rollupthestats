package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type Sizes struct {
	S Prizes `json:"s"`
	M Prizes `json:"m"`
	L Prizes `json:"l"`
	X Prizes `json:"x"`
}

type Prizes struct {
	None    int `json:"none"`
	Coffee  int `json:"coffee"`
	Donut   int `json:"donut"`
	Timcard int `json:"timcard"`
	Visa    int `json:"visa"`
	Tv      int `json:"tv"`
	Car     int `json:"car"`
}

func StatsHandler(db *sql.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		q := `SELECT size, prize, COUNT(id) AS count
			FROM logs 
			GROUP BY size, prize 
			ORDER BY size, prize`
		rows, err := db.Query(q)
		if err != nil {
			fmt.Printf("Error during SELECT query: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		result := Sizes{}
		var size, prize string
		var count int
		var p *Prizes
		for rows.Next() {
			err = rows.Scan(&size, &prize, &count)
			if err != nil {
				break
			}
			switch size {
			case "s":
				p = &result.S
			case "m":
				p = &result.M
			case "l":
				p = &result.L
			case "x":
				p = &result.X
			}
			switch prize {
			case "none":
				p.None = count
			case "coffee":
				p.Coffee = count
			case "donut":
				p.Donut = count
			case "timcard":
				p.Timcard = count
			case "visa":
				p.Visa = count
			case "tv":
				p.Tv = count
			case "car":
				p.Car = count
			}
		}
		if err != nil {
			fmt.Printf("Error while reading the SELECT results: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		resp, err := json.Marshal(result)
		if err != nil {
			fmt.Printf("Error marshalling response: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
		} else {
			fmt.Fprintf(w, string(resp))
		}
	}
}
