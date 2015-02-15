package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type Stats struct {
	Sizes     Sizes     `json:"sizes"`
	Provinces Provinces `json:"provinces"`
}

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

type Provinces struct {
	AB Prizes `json:"ab"`
	BC Prizes `json:"bc"`
	MB Prizes `json:"mb"`
	NB Prizes `json:"nb"`
	NL Prizes `json:"nl"`
	NS Prizes `json:"ns"`
	NT Prizes `json:"nt"`
	NU Prizes `json:"nu"`
	ON Prizes `json:"on"`
	PE Prizes `json:"pe"`
	QC Prizes `json:"qc"`
	SK Prizes `json:"sk"`
	YT Prizes `json:"yt"`
}

func setCount(prize string, count int, p *Prizes) {
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

func StatsHandler(db *sql.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		stats := Stats{}

		q := `SELECT size, prize, COUNT(id) AS count
			FROM logs 
			GROUP BY size, prize 
			ORDER BY size, prize`
		rows, err := db.Query(q)
		if err != nil {
			fmt.Printf("Error during sizes SELECT query: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

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
				p = &stats.Sizes.S
			case "m":
				p = &stats.Sizes.M
			case "l":
				p = &stats.Sizes.L
			case "x":
				p = &stats.Sizes.X
			}

			setCount(prize, count, p)
		}
		if err != nil {
			fmt.Printf("Error while reading the sizes SELECT results: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		q = `SELECT province, prize, COUNT(id) AS count 
			FROM logs 
			WHERE country = 'CANADA' 
			AND province IS NOT NULL
			AND province != 'NA'
			GROUP BY province, prize 
			ORDER BY province, prize;`
		rows, err = db.Query(q)
		if err != nil {
			fmt.Printf("Error during provinces SELECT query: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		var province string
		for rows.Next() {
			err = rows.Scan(&province, &prize, &count)
			if err != nil {
				break
			}

			switch province {
			case "Alberta":
				p = &stats.Provinces.AB
			case "British Columbia":
				p = &stats.Provinces.BC
			case "Manitoba":
				p = &stats.Provinces.MB
			case "New Brunswick":
				p = &stats.Provinces.NB
			case "Newfoundland":
				p = &stats.Provinces.NL
			case "Nova Scotia":
				p = &stats.Provinces.NS
			case "Northwest Territories":
				p = &stats.Provinces.NT
			case "Nunavut":
				p = &stats.Provinces.NU
			case "Ontario":
				p = &stats.Provinces.ON
			case "Prince Edward Island":
				p = &stats.Provinces.PE
			case "Quebec":
				p = &stats.Provinces.QC
			case "Saskatchewan":
				p = &stats.Provinces.SK
			case "Yukon":
				p = &stats.Provinces.YT
			}

			setCount(prize, count, p)
		}
		if err != nil {
			fmt.Printf("Error while reading the provinces SELECT results: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		resp, err := json.Marshal(stats)
		if err != nil {
			fmt.Printf("Error marshalling response: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
		} else {
			fmt.Fprintf(w, string(resp))
		}
	}
}
