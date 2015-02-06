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
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			fmt.Printf("Non-POST request received: %s", r.Method)
			http.Error(w, "Method Not Allowed", 405)
			return
		}

		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			fmt.Printf("Error reading body: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		var p Payload
		err = json.Unmarshal(body, &p)
		if err != nil {
			fmt.Printf("Error parsing JSON: %s\n%s", err.Error(), body)
			http.Error(w, err.Error(), 500)
			return
		}

		if p.Honeypot != "" {
			fmt.Printf("Honeypot triggered: %s", p.Honeypot)
			http.Error(w, "You do not appear to be human", 400)
			return
		}

		q := "INSERT INTO logs (size, prize, ip, created) VALUES (?, ?, ?, ?)"
		ips := strings.Split(r.Header.Get("X-Forwarded-For"), ", ")
		t := time.Now()
		_, err = db.Exec(q, p.Size, p.Prize, ips[0], t.Format(time.RFC3339))

		if err != nil {
			fmt.Printf("Error inserting record: %s", err.Error())
			http.Error(w, err.Error(), 500)
			return
		}

		fmt.Fprintf(w, "OK")
	}
}
