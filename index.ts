enum HttpMethod {
    HTTP_GET = 'GET',
    HTTP_POST = 'POST',
}

enum HttpStatus {
    HTTP_STATUS_OK = 200,
    HTTP_STATUS_INTERNAL_SERVER_ERROR = 500,
}

interface IStatus {
    status: HttpStatus
}

interface IError {

}

interface IUser {
    name: string,
    age: number,
    roles: string[],
    createdAt: Date,
    isDeleted: boolean
}

interface IRequest {
    method: HttpMethod,
    host: string,
    path: string,
    body?: IUser,
    params: { [key: string]: string };
};

interface IHandler {
    next?: (value: IRequest) => void;
    error?: (error: IError) => void;
    complete?: () => void;
}

type SubscribeFunc = (observer: Observer) => () => void;
type UnsubscribeFunc = () => void;

class Observer {
    private isUnsubscribed: boolean = false;
    private handlers: IHandler;
    private _unsubscribe?: UnsubscribeFunc;

    constructor(handlers: IHandler) {
        this.handlers = handlers;
    }

    setUnsubscribeCallback(unsubscribe: UnsubscribeFunc) {
        this._unsubscribe = unsubscribe;
    }

    next(value: IRequest) {
        if (this.handlers.next && !this.isUnsubscribed) {
            this.handlers.next(value);
        }
    }

    error(error: IError) {
        if (!this.isUnsubscribed) {
            if (this.handlers.error) {
                this.handlers.error(error);
            }

            this.unsubscribe();
        }
    }

    complete() {
        if (!this.isUnsubscribed) {
            if (this.handlers.complete) {
                this.handlers.complete();
            }

            this.unsubscribe();
        }
    }

    unsubscribe() {
        this.isUnsubscribed = true;

        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }
}

class Observable {
    private _subscribe: SubscribeFunc;

    constructor(subscribe: SubscribeFunc) {
        this._subscribe = subscribe;
    }

    static from(values: IRequest[]) {
        return new Observable((observer : Observer) => {
            values.forEach((value) => observer.next(value));

            observer.complete();

            return () => {
                console.log('unsubscribed');
            };
        });
    }

    subscribe(obs: IHandler) {
        const observer = new Observer(obs);

        observer.setUnsubscribeCallback(this._subscribe(observer));

        return ({
            unsubscribe() {
                observer.unsubscribe();
            }
        });
    }
}

const userMock : IUser = {
    name: 'User Name',
    age: 26,
    roles: [
        'user',
        'admin'
    ],
    createdAt: new Date(),
    isDeleted: false
};


const requestsMock : IRequest[] = [
    {
        method: HttpMethod.HTTP_POST,
        host: 'service.example',
        path: 'user',
        body: userMock,
        params: {},
    },
    {
        method: HttpMethod.HTTP_GET,
        host: 'service.example',
        path: 'user',
        params: {
            id: '3f5h67s4s'
        },
    }
];


class StatusFactory {
    static of(status: HttpStatus) {
        return {status: status};
    }
}

const handleRequest = (request: IRequest) => {
    // handling of request
    return StatusFactory.of(HttpStatus.HTTP_STATUS_OK);
};

const handleError = (error: IError) => {
    // handling of error
    return StatusFactory.of(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR);
};

const handleComplete = () => console.log('complete');

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete
});

subscription.unsubscribe();
