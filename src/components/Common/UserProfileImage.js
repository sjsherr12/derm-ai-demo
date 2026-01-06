import { useData } from "context/global/DataContext"
import { getUserPlaceholderProfile } from "utils/user"

const { default: DefaultText } = require("components/Text/DefaultText")
const { default: colors } = require("config/colors")
const { default: DefaultStyles } = require("config/styles")
const { Image, View, StyleSheet } = require("react-native")

const UserProfileImage = ({
    width,
    height,
    image,
    style,
}) => {

    const {userData} = useData();
    const placeholderProfile = getUserPlaceholderProfile(userData)

    const imageContainer = {
        width,
        height,
        borderRadius:64,
        backgroundColor:colors.background.light,
        justifyContent:'center',
        alignItems:'center',
        ...style,
    }

    return (
        <Image
            source={
                image ? {uri: image} : placeholderProfile
            }
            style={imageContainer}
        />
    )
}

export default UserProfileImage;