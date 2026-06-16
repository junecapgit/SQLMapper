-- Sample database schema for testing SqlMapper
-- This is a simplified e-commerce database

CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY AUTO_INCREMENT,
  CustomerName VARCHAR(100) NOT NULL,
  Email VARCHAR(100),
  Phone VARCHAR(20),
  City VARCHAR(50),
  Country VARCHAR(50)
);

CREATE TABLE Categories (
  CategoryID INT PRIMARY KEY AUTO_INCREMENT,
  CategoryName VARCHAR(50) NOT NULL,
  Description TEXT
);

CREATE TABLE Products (
  ProductID INT PRIMARY KEY AUTO_INCREMENT,
  ProductName VARCHAR(100) NOT NULL,
  CategoryID INT,
  Price DECIMAL(10, 2),
  StockQuantity INT DEFAULT 0,
  CONSTRAINT fk_product_category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY AUTO_INCREMENT,
  CustomerID INT NOT NULL,
  OrderDate DATE NOT NULL,
  TotalAmount DECIMAL(10, 2),
  Status VARCHAR(20) DEFAULT 'Pending',
  CONSTRAINT fk_order_customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

CREATE TABLE OrderDetails (
  OrderDetailID INT PRIMARY KEY AUTO_INCREMENT,
  OrderID INT NOT NULL,
  ProductID INT NOT NULL,
  Quantity INT NOT NULL,
  UnitPrice DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_orderdetail_order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
  CONSTRAINT fk_orderdetail_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

CREATE TABLE Suppliers (
  SupplierID INT PRIMARY KEY AUTO_INCREMENT,
  SupplierName VARCHAR(100) NOT NULL,
  ContactName VARCHAR(100),
  Phone VARCHAR(20),
  Email VARCHAR(100),
  Country VARCHAR(50)
);

CREATE TABLE ProductSuppliers (
  ProductID INT NOT NULL,
  SupplierID INT NOT NULL,
  SupplyPrice DECIMAL(10, 2),
  PRIMARY KEY (ProductID, SupplierID),
  CONSTRAINT fk_ps_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
  CONSTRAINT fk_ps_supplier FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
);

-- Disconnected table for testing
CREATE TABLE AuditLog (
  LogID INT PRIMARY KEY AUTO_INCREMENT,
  ActionType VARCHAR(50),
  ActionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Description TEXT
);
