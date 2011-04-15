#ifndef WIDGET_H
#define WIDGET_H

#include <QtGui/QWidget>
#include <QPushButton>
#include <QPlainTextEdit>
#include <QTcpServer>
#include <QTcpSocket>
#include <QList>

#include "client.h"

class Widget : public QWidget
{
    Q_OBJECT

public:
    Widget(QWidget *parent = 0);
    ~Widget();

private slots:
    void startServerButtonClicked();
    void tcpServerNewConnection();
    void clientGotMessage(int i, QByteArray ba);
    void clientHandShaked(int i);
    void clientDisconnected(int i);

private:

    int port;
    QList<Client *> cl;
    int cn;
    QPushButton *startServerButton;
    QPlainTextEdit *ptEdit;
    QTcpServer *tcpServer;

};

#endif // WIDGET_H
