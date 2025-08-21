import { Maps, Props } from "../Maps";
import { render } from "@testing-library/react-native";
import { dynamicValue } from "@mendix/piw-utils-internal";
import { Big } from "big.js";
import { createElement } from "react";

// Mock react-native-maps
// Without this, the Maps component renders only an empty AIRMap component without markers
jest.mock("react-native-maps", () => {
    const React = require("react");
    const { View } = require("react-native");

    const MapView = React.forwardRef((props: any, ref: any) => {
        // Simulate onMapReady being called after component mounts
        React.useEffect(() => {
            if (props.onMapReady) {
                setTimeout(() => props.onMapReady(), 0);
            }
        }, [props.onMapReady]);

        // Add ref methods that the Maps component expects
        React.useImperativeHandle(ref, () => ({
            fitToCoordinates: jest.fn(),
            animateCamera: jest.fn(),
            setCamera: jest.fn(),
            getCamera: jest.fn(() =>
                Promise.resolve({
                    center: { latitude: 0, longitude: 0 },
                    zoom: 10,
                    altitude: 1000
                })
            )
        }));

        return <View {...props} />;
    });

    return {
        __esModule: true,
        default: MapView,
        Marker: (props: any) => <View {...props} />,
        Callout: (props: any) => <View {...props} />
    };
});

describe("<Maps />", () => {
    let defaultProps: Props;

    beforeEach(() => {
        defaultProps = {
            name: "maps-test",
            style: [],
            markers: [],
            dynamicMarkers: [],
            fitToMarkers: true,
            defaultZoomLevel: "city",
            minZoomLevel: "city",
            maxZoomLevel: "streets",
            mapType: "standard",
            provider: "default",
            interactive: true,
            showsUserLocation: false
        };
    });

    it("renders", async () => {
        defaultProps.markers = [
            {
                locationType: "latlng", // Tokyo
                latitude: dynamicValue(new Big(35.6895), false),
                longitude: dynamicValue(new Big(139.6917), false),
                iconSize: 1,
                iconColor: "red"
            },
            {
                locationType: "latlng", // Amsterdam
                latitude: dynamicValue(new Big(52.3702), false),
                longitude: dynamicValue(new Big(4.8952), false),
                iconSize: 1,
                iconColor: "red"
            }
        ];

        const component = render(<Maps {...defaultProps} />);

        // Give the component time to complete async operations
        await new Promise(resolve => setTimeout(resolve, 1000));

        expect(component.toJSON()).toMatchSnapshot();
    });
});
