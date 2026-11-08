module.exports = {
	entry: './src/index.js',
	output: {
		path: __dirname + '/dist',
		filename: 'main.js'
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			},
			{
			  test: /\.css$/,
			  use: [ 'style-loader', 'css-loader' ],
			}
		]
	}
};