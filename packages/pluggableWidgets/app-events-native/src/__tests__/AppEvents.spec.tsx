import { actionValue } from "@mendix/piw-utils-internal";
import { createElement } from "react";
import { AppStateStatus } from "react-native";

import { mount } from "enzyme";

import { AppEvents, Props } from "../AppEvents";

let appStateChangeHandler: ((state: AppStateStatus) => void) | undefined;
let connectionChangeHandler: ((result: { isConnected: boolean }) => void) | undefined;

function flushMicrotasksQueue() {
    return new Promise(resolve => setImmediate(resolve));
}

jest.mock("@react-native-community/netinfo", () => ({
    fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
    addEventListener: jest.fn(listener => {
        connectionChangeHandler = listener;
        return () => {
            connectionChangeHandler = undefined;
        };
    })
}));

describe("AppEvents", () => {
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "app-events-test",
            onResumeTimeout: 0,
            onOnlineTimeout: 0,
            onOfflineTimeout: 0,
            delayTime: 30,
            timerType: "once",
            style: []
        };
    });

describe("AppEvents", () => {
    let oldAppStateState: any;
    let oldAppStateEventListener: any;

    beforeAll(() => {
        oldAppStateState = AppState.currentState;
        oldAppStateEventListener = AppState.addEventListener;
        AppState.currentState = "active";
        AppState.addEventListener = jest.fn((_type, listener) => {
            appStateChangeHandler = listener;
            return { remove: jest.fn(() => (appStateChangeHandler = undefined)) };
        });
    });

    afterAll(() => {
        AppState.currentState = oldAppStateState;
        AppState.addEventListener = oldAppStateEventListener;
    });

    afterEach(() => {
        appStateChangeHandler = undefined;
        connectionChangeHandler = undefined;
    });

    it("does not render anything", () => {
        const wrapper = mount(<AppEvents {...defaultProps} />);
        expect(wrapper).toMatchObject({});
    });

    describe("with on load action", () => {
        it("executes the on load action", () => {
            const onLoadAction = actionValue();
            mount(<AppEvents {...defaultProps} onLoadAction={onLoadAction} />);
            expect(onLoadAction.execute).toHaveBeenCalledTimes(1);
        });
    });

    describe("with on resume action", () => {
        it("registers and unregisters an event listener", () => {
            const onResumeAction = actionValue();
            const wrapper = mount(<AppEvents {...defaultProps} onResumeAction={onResumeAction} />);

            expect(appStateChangeHandler).toBeDefined();
            wrapper.unmount();
            expect(appStateChangeHandler).toBeUndefined();
        });

        it("executes the on resume action", () => {
            const onResumeAction = actionValue();
            mount(<AppEvents {...defaultProps} onResumeAction={onResumeAction} />);

            appStateChangeHandler!("background");
            appStateChangeHandler!("active");
            expect(onResumeAction.execute).toHaveBeenCalledTimes(1);
        });

        it("does not execute the on resume action when the app state hasn't changed", () => {
            const onResumeAction = actionValue();
            mount(<AppEvents {...defaultProps} onResumeAction={onResumeAction} />);

            appStateChangeHandler!("active");
            appStateChangeHandler!("active");
            expect(onResumeAction.execute).toHaveBeenCalledTimes(0);
        });

        it("only executes the on resume action after the timeout passed", () => {
            const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(0);

            const onResumeAction = actionValue();
            mount(<AppEvents {...defaultProps} onResumeAction={onResumeAction} onResumeTimeout={5} />);

            dateNowSpy.mockReturnValue(4000);
            appStateChangeHandler!("background");
            appStateChangeHandler!("active");
            expect(onResumeAction.execute).toHaveBeenCalledTimes(0);

            dateNowSpy.mockReturnValue(6000);
            appStateChangeHandler!("background");
            appStateChangeHandler!("active");
            expect(onResumeAction.execute).toHaveBeenCalledTimes(1);

            dateNowSpy.mockRestore();
        });
    });

    describe("with on online action", () => {
        it("registers and unregisters an event listener", async () => {
            const onOnlineAction = actionValue();
            const wrapper = mount(<AppEvents {...defaultProps} onOnlineAction={onOnlineAction} />);
            await flushMicrotasksQueue();

            expect(connectionChangeHandler).toBeDefined();
            wrapper.unmount();
            expect(connectionChangeHandler).toBeUndefined();
        });

        it("executes the on online action", async () => {
            const onOnlineAction = actionValue();
            mount(<AppEvents {...defaultProps} onOnlineAction={onOnlineAction} />);
            await flushMicrotasksQueue();

            connectionChangeHandler!({ isConnected: false });
            connectionChangeHandler!({ isConnected: true });
            expect(onOnlineAction.execute).toHaveBeenCalledTimes(1);
        });

        it("only executes the on online action after the timeout passed", async () => {
            const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(0);

            const onOnlineAction = actionValue();
            mount(<AppEvents {...defaultProps} onOnlineAction={onOnlineAction} onOnlineTimeout={5} />);
            await flushMicrotasksQueue();

            dateNowSpy.mockReturnValue(4000);
            connectionChangeHandler!({ isConnected: false });
            connectionChangeHandler!({ isConnected: true });
            expect(onOnlineAction.execute).toHaveBeenCalledTimes(0);

            dateNowSpy.mockReturnValue(6000);
            connectionChangeHandler!({ isConnected: false });
            connectionChangeHandler!({ isConnected: true });
            expect(onOnlineAction.execute).toHaveBeenCalledTimes(1);

            dateNowSpy.mockRestore();
        });

        it("does not execute the on online action if the connection state didn't change", async () => {
            const onOnlineAction = actionValue();
            mount(<AppEvents {...defaultProps} onOnlineAction={onOnlineAction} />);
            await flushMicrotasksQueue();

            connectionChangeHandler!({ isConnected: true });
            connectionChangeHandler!({ isConnected: false });
            connectionChangeHandler!({ isConnected: false });
            expect(onOnlineAction.execute).toHaveBeenCalledTimes(0);
        });
    });

    describe("with on timeout action", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("executes the on timeout action once after the timeout has passed", () => {
            const onTimeoutAction = actionValue();
            mount(<AppEvents {...defaultProps} onTimeoutAction={onTimeoutAction} />);

            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(0);
            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(1);
        });

        it("does not execute the on timeout action after the component has been unmounted", () => {
            const onTimeoutAction = actionValue();
            const wrapper = mount(<AppEvents {...defaultProps} onTimeoutAction={onTimeoutAction} />);
            jest.advanceTimersByTime(15000);
            wrapper.unmount();
            jest.advanceTimersByTime(15000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(0);
        });

        it("executes the interval on timeout action after every interval", () => {
            const onTimeoutAction = actionValue();
            mount(<AppEvents {...defaultProps} onTimeoutAction={onTimeoutAction} timerType={"interval"} />);

            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(0);
            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(2);
        });

        it("does not execute the interval on timeout action after the component has been unmounted", () => {
            const onTimeoutAction = actionValue();
            const wrapper = mount(
                <AppEvents {...defaultProps} onTimeoutAction={onTimeoutAction} timerType={"interval"} />
            );

            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(1);
            wrapper.unmount();
            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).toHaveBeenCalledTimes(1);
        });

        it("does not execute the interval on timeout action when it is already executing", () => {
            const onTimeoutAction = actionValue(true, true);
            mount(<AppEvents {...defaultProps} onTimeoutAction={onTimeoutAction} timerType={"interval"} />);

            jest.advanceTimersByTime(30000);
            expect(onTimeoutAction.execute).not.toHaveBeenCalled();
        });
    });
});
