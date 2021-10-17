import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { logError, debounce, stripHtml } from 'utils';
import { useStorefront } from 'hooks';
import ProductPriceView from './ProductPriceView';
import tailwind from 'tailwind';

const windowHeight = Dimensions.get('window').height;
const dialogHeight = windowHeight / 2;

const NetworkSearch = ({ network, wrapperStyle, buttonTitle, buttonStyle, buttonIcon, buttonIconStyle, onResultPress, placeholder }) => {
    buttonTitle = buttonTitle ?? `Search ${network.getAttribute('name')}`;
    buttonIcon = buttonIcon ?? faSearch;

    const insets = useSafeAreaInsets();
    const storefront = useStorefront();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState(null);

    const closeDialog = () => setIsDialogOpen(false);

    const handleResultPress = (result) => {
        if (typeof onResultPress === 'function') {
            onResultPress(result, closeDialog);
        }
    };

    const fetchResultsFromStore = async (query, cb) => {
        setIsLoading(true);

        const results = await storefront.search(query).catch(logError);

        setIsLoading(false);

        if (typeof cb === 'function') {
            cb(results);
        }
    };

    const debouncedSearch = debounce((query, cb) => {
        fetchResultsFromStore(query, cb);
    }, 600);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        debouncedSearch(query, (results) => {
            setResults(results);
        });
    }, [query]);

    return (
        <View style={[wrapperStyle]}>
            <TouchableOpacity onPress={() => setIsDialogOpen(true)}>
                <View style={[tailwind(`flex flex-row items-center bg-gray-100 rounded-md px-3 pr-2 h-10`), buttonStyle]}>
                    <FontAwesomeIcon icon={buttonIcon} style={[tailwind('mr-2 text-gray-800'), buttonIconStyle]} />
                    <Text style={[tailwind('text-gray-500 text-base'), buttonStyle]}>{buttonTitle}</Text>
                </View>
            </TouchableOpacity>

            <Modal animationType={'slide'} transparent={true} visible={isDialogOpen} onRequestClose={closeDialog}>
                <View style={[tailwind('w-full h-full bg-white'), { paddingTop: insets.top }]}>
                    <View style={tailwind('px-5 py-2 flex flex-row items-center justify-between')}>
                        <View style={tailwind('flex-1 pr-4')}>
                            <View style={tailwind('relative overflow-hidden')}>
                                <View style={tailwind('absolute top-0 bottom-0 left-0 h-full flex items-center justify-center z-10')}>
                                    <FontAwesomeIcon icon={buttonIcon} style={[tailwind('text-gray-800 ml-3'), buttonIconStyle]} />
                                </View>
                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    autoComplete={'off'}
                                    autoCorrect={false}
                                    autoCapitalize={'none'}
                                    autoFocus={true}
                                    clearButtonMode={'while-editing'}
                                    textAlign={'left'}
                                    style={tailwind('bg-gray-100 rounded-md pl-10 pr-2 h-10')}
                                    placeholder={buttonTitle}
                                />
                            </View>
                        </View>

                        <View>
                            <TouchableOpacity onPress={closeDialog}>
                                <View style={tailwind('rounded-full bg-red-50 w-8 h-8 flex items-center justify-center')}>
                                    <FontAwesomeIcon icon={faTimes} style={tailwind('text-red-900')} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {isLoading && (
                        <View style={tailwind('w-full px-5 py-4 flex flex-row items-center')}>
                            <ActivityIndicator />
                            <Text style={tailwind('ml-2 text-gray-400')}>Searching...</Text>
                        </View>
                    )}
                    <ScrollView showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                        {results.map((product, index) => (
                            <TouchableOpacity key={index} onPress={() => handleResultPress(product)}>
                                <View style={tailwind('px-5 py-4 border-b border-gray-100')}>
                                    <View style={tailwind('flex flex-row')}>
                                        <View style={tailwind('mr-3')}>
                                            <View style={tailwind('border border-gray-200 shadow-sm')}>
                                                <Image source={{ uri: product.getAttribute('primary_image_url') }} style={tailwind('h-14 w-14')} />
                                            </View>
                                        </View>
                                        <View style={tailwind('flex-1')}>
                                            <Text style={tailwind('font-semibold text-base')} numberOfLines={1}>
                                                {product.getAttribute('name')}
                                            </Text>
                                            <Text style={tailwind('text-gray-400 mb-2')} numberOfLines={1}>
                                                {stripHtml(product.getAttribute('description')) || 'No description'}
                                            </Text>
                                            <ProductPriceView product={product} />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={tailwind('w-full h-40')}></View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

export default NetworkSearch;
