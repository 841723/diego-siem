package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

type Log struct {
	Service string `json:"service"`
	Message string `json:"message"`
	Level   string `json:"level"`
}

var logs []Log
var mu sync.Mutex

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func receiveLog(w http.ResponseWriter, r *http.Request) {
	var l Log
	json.NewDecoder(r.Body).Decode(&l)

	mu.Lock()
	logs = append(logs, l)
	mu.Unlock()

	log.Printf("[LOG] %+v\n", l)

	w.WriteHeader(http.StatusOK)
}

func getLogs(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	log.Printf("[GET LOGS] Total logs: %d\n", len(logs))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func main() {
	http.HandleFunc("/logs", receiveLog)
	http.HandleFunc("/logs/all", enableCORS(getLogs))

	log.Println("Backend running on :8080")
	http.ListenAndServe(":8080", nil)
}