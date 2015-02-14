package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"
)

type Payload struct {
	Size     string `json:"size"`
	Prize    string `json:"prize"`
	Honeypot string `json:"honeypot"`
}

func LogHandler(db *sql.DB) func(w http.ResponseWriter, r *http.Request) {
	sizes := [4]string{"s", "m", "l", "x"}
	prizes := [7]string{"none", "coffee", "donut", "timcard", "visa", "tv", "car"}

	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			fmt.Printf("Non-POST request received: %s\n", r.Method)
			http.Error(w, "Method Not Allowed", 405)
			return
		}

		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			fmt.Printf("Error reading body: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		var p Payload
		err = json.Unmarshal(body, &p)
		if err != nil {
			fmt.Printf("Error parsing JSON: %s\n%s\n", err.Error(), body)
			http.Error(w, err.Error(), 500)
			return
		}

		if p.Honeypot != "" {
			fmt.Printf("Honeypot triggered: %s\n", p.Honeypot)
			http.Error(w, "You do not appear to be human", 400)
			return
		}

		found := false
		for _, size := range sizes {
			if size == p.Size {
				found = true
			}
		}
		if !found {
			fmt.Printf("Invalid size: %s\n", p.Size)
			http.Error(w, "You are being naughty", 400)
			return
		}

		found = false
		for _, prize := range prizes {
			if prize == p.Prize {
				found = true
			}
		}
		if !found {
			fmt.Printf("Invalid prize: %s\n", p.Prize)
			http.Error(w, "You are being naughty", 400)
			return
		}

		q := "INSERT INTO logs (size, prize, ip, created) VALUES (?, ?, ?, ?)"
		ips := strings.Split(r.Header.Get("X-Forwarded-For"), ", ")
		t := time.Now()
		_, err = db.Exec(q, p.Size, p.Prize, ips[0], t.Format(time.RFC3339))
		if err != nil {
			fmt.Printf("Error inserting record: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		fmt.Fprintf(w, "OK")
	}
}
