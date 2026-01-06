module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'], // or 'module:metro-react-native-babel-preset' for plain RN
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./src'],
                    alias: {
                        data: './src/data',
                        context: './src/context',
                        screens: './src/screens',
                        components: './src/components',
                        assets: './src/assets',
                    },
                    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
                },
            ],
        ],
    };
};
