package model

import (
	"github.com/google/uuid"
)

type ID uuid.UUID

func GenerateUUID() ID {
	return ID(uuid.New())
}

func ParseAndCheckUUID(s string) (ID, error) {
	u, err := uuid.Parse(s)
	return ID(u), err
}

func ParseUUID(s string) ID {
	u, err := uuid.Parse(s)
	if err != nil {
		panic(err)
	}
	return ID(u)
}

func (id ID) String() string {
	return uuid.UUID(id).String()
}

// when created with GenerateErrorUUID, it will return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
func GenerateErrorUUID() ID {
	return ID(uuid.Nil)
}
