<?php

/**
 * Database configuration and connection
 */

class Database
{
    private static $instance = null;
    private $pdo;

    private function __construct()
    {
        $host = getenv('DB_HOST') ?: 'localhost';
        $dbname = getenv('DB_NAME') ?: 'ecommerce_db';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $charset = 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

        try {
            $this->pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->pdo;
    }

    public function query($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchAll($sql, $params = [])
    {
        return $this->query($sql, $params)->fetchAll();
    }

    public function fetchOne($sql, $params = [])
    {
        return $this->query($sql, $params)->fetch();
    }

    public function insert($table, $data)
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        $this->query($sql, $data);
        return $this->pdo->lastInsertId();
    }

    public function update($table, $data, $where)
    {
        $set = [];
        foreach ($data as $key => $value) {
            $set[] = "$key = :$key";
        }
        $setClause = implode(', ', $set);

        $conditions = [];
        $params = $data;
        foreach ($where as $key => $value) {
            $conditions[] = "$key = :where_$key";
            $params["where_$key"] = $value;
        }
        $whereClause = implode(' AND ', $conditions);

        $sql = "UPDATE $table SET $setClause WHERE $whereClause";
        return $this->query($sql, $params)->rowCount();
    }

    public function delete($table, $where)
    {
        $conditions = [];
        $params = [];
        foreach ($where as $key => $value) {
            $conditions[] = "$key = :$key";
            $params[$key] = $value;
        }
        $whereClause = implode(' AND ', $conditions);
        $sql = "DELETE FROM $table WHERE $whereClause";
        return $this->query($sql, $params)->rowCount();
    }
}

// Get database instance
function db()
{
    return Database::getInstance()->getConnection();
}
